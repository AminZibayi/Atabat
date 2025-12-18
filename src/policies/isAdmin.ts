// In the Name of God, the Creative, the Originator
import type { Access } from 'payload';

export const isAdmin: Access = ({ req: { user } }) => {
  return user?.collection === 'users';
};
