import { APIError } from '../api';

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('APIError class', () => {
    it('creates error with status and message', () => {
      const error = new APIError(400, 'Bad Request');

      expect(error.status).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.name).toBe('APIError');
    });

    it('creates error with details', () => {
      const details = { field: 'email', error: 'Invalid format' };
      const error = new APIError(400, 'Validation failed', details);

      expect(error.status).toBe(400);
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual(details);
    });

    it('extends Error class correctly', () => {
      const error = new APIError(500, 'Server Error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
    });

    it('has correct error name', () => {
      const error = new APIError(404, 'Not Found');

      expect(error.name).toBe('APIError');
    });

    it('supports different HTTP status codes', () => {
      const error401 = new APIError(401, 'Unauthorized');
      const error403 = new APIError(403, 'Forbidden');
      const error404 = new APIError(404, 'Not Found');
      const error500 = new APIError(500, 'Internal Server Error');

      expect(error401.status).toBe(401);
      expect(error403.status).toBe(403);
      expect(error404.status).toBe(404);
      expect(error500.status).toBe(500);
    });

    it('can be caught and handled like standard errors', () => {
      const throwError = () => {
        throw new APIError(400, 'Bad Request');
      };

      expect(throwError).toThrow(APIError);
      expect(throwError).toThrow('Bad Request');
    });
  });
});
