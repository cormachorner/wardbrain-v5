import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../../lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { requireAdminRoute } from "../../../../../lib/adminAuth"

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().optional(),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) return authResult.response

  try {
    const { id } = await params
    const body = await request.json()
    const updateData = updateUserSchema.parse(body)
    const userId = id

    // Prepare update data
    const data: {
      email?: string
      name?: string
      role?: "STUDENT" | "INSTRUCTOR" | "ADMIN"
      password?: string
    } = {}
    if (updateData.email) data.email = updateData.email.toLowerCase().trim()
    if (updateData.name !== undefined) data.name = updateData.name
    if (updateData.role) data.role = updateData.role
    if (updateData.password) data.password = await bcrypt.hash(updateData.password, 12)

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "User not found or update failed" },
      { status: 404 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) return authResult.response

  try {
    const { id } = await params
    const userId = id

    // Prevent admin from deleting themselves
    if (authResult.userId === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "User not found or delete failed" },
      { status: 404 }
    )
  }
}
