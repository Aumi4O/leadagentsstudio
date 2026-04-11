/**
 * Render/Linux containers set HOSTNAME to the container id. Next.js standalone
 * binds to process.env.HOSTNAME when set, so the app listens on the wrong
 * interface and Render returns 502 Bad Gateway. Force all interfaces.
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/output
 */
process.env.HOSTNAME = "0.0.0.0"

require("../.next/standalone/server.js")
