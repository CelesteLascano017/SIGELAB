export function patchCookieConverter(source) {
  const originalImport = 'import cookieParser from "cookie";'
  const patchedImport = 'import { parse as parseCookieHeader } from "cookie";'
  if (source.includes(patchedImport) && !source.includes('cookieParser')) return source
  if (!source.includes(originalImport) || !source.includes('cookieParser.parse(')) {
    throw new Error('Unknown OpenNext cookie converter. Review the compatibility patch before building.')
  }
  return source.replace(originalImport, patchedImport).replaceAll('cookieParser.parse(', 'parseCookieHeader(')
}
