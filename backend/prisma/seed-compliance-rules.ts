import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ComplianceRuleData {
  ruleId: string;
  category: string;
  parameter: string | null;
  description: string;
  isActive: boolean;
  applicability: string;
  effectiveDate: string;
  maxValue?: number;
  minValue?: number;
  unit?: string;
  frequency?: string;
  sampleLocation?: string;
  testMethod?: string;
}

interface ComplianceRulesJson {
  metadata: {
    source: string;
    sheet: string;
    extractionDate: string;
    totalRules: number;
  };
  rules: ComplianceRuleData[];
}

async function seedComplianceRules() {
  console.log('🌱 Starting compliance rules seed...');

  try {
    // Load compliance rules JSON
    const jsonPath = path.join(__dirname, 'seeds', 'compliance_rules.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const data: ComplianceRulesJson = JSON.parse(jsonData);

    console.log(`📊 Found ${data.metadata.totalRules} compliance rules to seed`);
    console.log(`📁 Source: ${data.metadata.source}`);
    console.log(`📅 Extraction Date: ${data.metadata.extractionDate}`);

    // Delete existing rules
    const deleteResult = await prisma.complianceRule.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.count} existing rules`);

    // Insert new rules
    let successCount = 0;
    let errorCount = 0;

    for (const rule of data.rules) {
      try {
        await prisma.complianceRule.create({
          data: {
            ruleId: rule.ruleId,
            category: rule.category as any, // Enum will validate
            parameter: rule.parameter,
            description: rule.description,
            isActive: rule.isActive,
            applicability: rule.applicability,
            effectiveDate: new Date(rule.effectiveDate),
            maxValue: rule.maxValue,
            minValue: rule.minValue,
            unit: rule.unit,
            frequency: rule.frequency,
            sampleLocation: rule.sampleLocation,
            testMethod: rule.testMethod,
          },
        });
        successCount++;

        if (successCount % 50 === 0) {
          console.log(`✅ Seeded ${successCount}/${data.metadata.totalRules} rules...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error seeding rule ${rule.ruleId}:`, error);
      }
    }

    console.log('\n📈 Seeding Summary:');
    console.log(`   ✅ Successfully seeded: ${successCount} rules`);
    console.log(`   ❌ Errors: ${errorCount} rules`);
    console.log(`   📊 Total in database: ${successCount} rules`);

    // Verify counts by category
    const categoryCounts = await prisma.complianceRule.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    });

    console.log('\n📊 Rules by Category:');
    for (const cat of categoryCounts) {
      console.log(`   ${cat.category}: ${cat._count.category} rules`);
    }

    console.log('\n✨ Compliance rules seeding complete!\n');
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedComplianceRules()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
