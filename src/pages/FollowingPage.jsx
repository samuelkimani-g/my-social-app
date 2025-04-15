"use client"

import { useParams } from "react-router-dom"
import ProfileFollowers from "../components/ProfileFollowers"

export default function FollowingPage() {
  const { userId } = useParams()

  return <ProfileFollowers userId={userId} type="following" />
}
