// In the Name of God, the Creative, the Originator
import type { Access } from 'payload';

export const isReservationOwner: Access = ({ req: { user }, data }) => {
  if (user && user.collection === 'pilgrims') {
    // If we have data (e.g. create/update), ensure the pilgrim matches the logged in user
    if (data && typeof data.pilgrim === 'string') {
      return data.pilgrim === user.id;
    }

    return {
      pilgrim: {
        equals: user.id,
      },
    };
  }
  return false;
};
