/**
 * User identity utilities
 */

export function getUserFullName(user: {
  firstName: string;
  lastName: string;
}): string {
  return `${user.firstName} ${user.lastName}`;
}

