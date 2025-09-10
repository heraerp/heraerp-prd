const PATTERN = /^HERA\.[A-Z]+(\.[A-Z]+){3}\.v\d+$/

export const isSmartCode = (s: string) => PATTERN.test(s)

export default isSmartCode

