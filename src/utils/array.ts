export const getDifference = <T>(a: T[], b: T[]): T[] => {
  return a.filter((element) => {
    return !b.includes(element)
  })
}
