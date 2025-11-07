import jwt from 'jsonwebtoken';

function getTokenFromReq(req) {
  const bearer = req.headers.authorization;
  if (bearer && bearer.startsWith('Bearer ')) return bearer.split(' ')[1];
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

export function requireAuth(role) {
  return (req, res, next) => {
    try {
      const token = getTokenFromReq(req);
      if (!token) return res.status(401).json({ message: 'Not authenticated' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (role && decoded.role !== role) return res.status(403).json({ message: 'Forbidden' });
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

export function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction || String(process.env.COOKIE_SECURE).toLowerCase() === 'true';
  
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}


