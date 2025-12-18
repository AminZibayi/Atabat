// In the Name of God, the Creative, the Originator
import type { Access } from 'payload';

export const isPilgrimOwner: Access = ({ req: { user } }) => {
  if (user && user.collection === 'pilgrims') {
    return {
      id: {
        equals: user.id,
      },
    };
  }
  return false;
};
