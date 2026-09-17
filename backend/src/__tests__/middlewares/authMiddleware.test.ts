import jwt from 'jsonwebtoken';
import type { Response, NextFunction } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../../middlewares/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * The middleware only touches `req.headers`, `res.status().json()` and `next`,
 * so instead of booting an HTTP server we hand it hand-rolled doubles. This is
 * a *unit* test: no network, no framework, just the function's contract.
 */
function makeReq(authorization?: string): AuthenticatedRequest {
  return {
    headers: authorization ? { authorization } : {},
  } as AuthenticatedRequest;
}

function makeRes() {
  // `status` returns `res` so the real code can chain `.status(401).json(...)`.
  const res = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res as typeof res & Response;
}

describe('authenticateToken', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn();
  });

  it('attaches the decoded user and calls next() for a valid token', () => {
    const token = jwt.sign({ id: 7, email: 'user@example.com' }, JWT_SECRET, {
      expiresIn: '1h',
    });
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeUndefined();
    expect(req.user).toMatchObject({ id: 7, email: 'user@example.com' });
  });

  it('responds 401 when the Authorization header is missing', () => {
    const req = makeReq();
    const res = makeRes();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('responds 401 when the header has no token after the scheme', () => {
    const req = makeReq('Bearer');
    const res = makeRes();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('responds 403 for a token signed with the wrong secret', () => {
    const token = jwt.sign({ id: 7, email: 'user@example.com' }, 'a-different-secret');
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Forbidden' });
  });

  it('responds 403 for an expired token', () => {
    const token = jwt.sign({ id: 7, email: 'user@example.com' }, JWT_SECRET, {
      expiresIn: '-1s',
    });
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('responds 403 for a malformed token', () => {
    const req = makeReq('Bearer not-a-jwt');
    const res = makeRes();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});
