import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos el tipo Request de Express para agregar
// el campo 'usuario' que vamos a llenar con los datos del JWT
export interface RequestConUsuario extends Request {
  usuario?: {
    id_usuario:  number;
    nom_usuario: string;
    rol:         string;
  };
}

// Middleware que verifica el token JWT.
// Se coloca antes de cualquier ruta protegida.
export const authenticate = (
  req: RequestConUsuario,
  res: Response,
  next: NextFunction
): void => {

  // El token viene en el header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as {
      id_usuario: number;
      nom_usuario: string;
      rol: string;
    };

    // Adjuntamos los datos del usuario al request
    // para que los controllers puedan usarlos
    req.usuario = decoded;
    next();

  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware que verifica que el usuario tiene el rol requerido.
// Se usa DESPUÉS de authenticate.
// Ejemplo de uso: router.get('/ruta', authenticate, authorize(['admin']), controller)
export const authorize = (rolesPermitidos: string[]) => {
  return (
    req: RequestConUsuario,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.usuario) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      res.status(403).json({
        error: `Acceso denegado. Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
      });
      return;
    }

    next();
  };
};