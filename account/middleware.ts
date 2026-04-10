export { auth as middleware } from "auth"

// Or like this if you need to do something here.
// export default auth((req) => {
//   console.log(req.auth) //  { session: { user: { ... } } }
// })

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
/** Only run auth on routes that need it — keeps /survey and other public pages fast. */
export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*"],
}
