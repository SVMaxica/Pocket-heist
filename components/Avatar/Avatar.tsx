import styles from "./Avatar.module.css"

interface AvatarProps {
  name: string
}

function getInitials(name: string) {
  const isPascalCase = /^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)+$/.test(name)

  if (isPascalCase) {
    return name.match(/[A-Z]/g)!.slice(0, 2).join("")
  }

  return name.charAt(0)
}

export default function Avatar({ name }: AvatarProps) {
  return (
    <div className={styles.avatar}>
      {getInitials(name)}
    </div>
  )
}
