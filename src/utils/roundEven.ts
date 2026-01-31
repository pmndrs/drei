/**
 * Round a number to the nearest even integer (ceiling).
 * Used to fix iOS fractional pixel bugs when forceEven is enabled.
 */
export const roundEven = (n: number): number => {
  const rounded = Math.ceil(n)
  return rounded % 2 === 0 ? rounded : rounded + 1
}
