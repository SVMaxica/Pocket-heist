// förhandsgranskningssida för nyskapade UI-komponenter

import SkeletonCard from "@/components/SkeletonCard"
import Avatar from "@/components/Avatar"

export default function PreviewPage() {
  return (
    <div className="page-content">
      <h2>Preview</h2>

      <section>
        <h3>SkeletonCard</h3>
        <SkeletonCard />
      </section>

      <section>
        <h3>Avatar</h3>
        <div className="flex gap-2">
          <Avatar name="Anna" />
          <Avatar name="UserProfile" />
        </div>
      </section>
    </div>
  )
}
