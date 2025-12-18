// In the Name of God, the Creative, the Originator
import type { Access } from 'payload';

export const isUserOwner: Access = ({ req: { user } }) => {
  if (user && user.collection === 'users') {
    return {
      id: {
        equals: user.id,
      },
    };
  }
  return false;
};
