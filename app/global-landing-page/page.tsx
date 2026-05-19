import { Suspense } from "react"
import  GlobalLandingPageBuilderClient  from "./GlobalLandingPageBuilderClient"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GlobalLandingPageBuilderClient />
    </Suspense>
  )
}