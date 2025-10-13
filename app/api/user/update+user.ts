import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();

    const {
      clerkId,
      name,
      skills,
      experienceLevel,
      hourlyRate,
      completedOnboarding = true, // 👈 include this
    } = body;

    if (!clerkId) {
      return Response.json({ error: "Clerk ID is required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO users (
        clerk_id,
        name,
        skills,
        experience_level,
        hourly_rate,
        completed_onboarding,
        updated_at
      )
      VALUES (
        ${clerkId},
        ${name},
        ${skills},
        ${experienceLevel},
        ${hourlyRate},
        ${completedOnboarding},
        NOW()
      )
      ON CONFLICT (clerk_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        skills = EXCLUDED.skills,
        experience_level = EXCLUDED.experience_level,
        hourly_rate = EXCLUDED.hourly_rate,
        completed_onboarding = EXCLUDED.completed_onboarding,
        updated_at = NOW()
      RETURNING *;
    `;

    return Response.json(
      { success: true, user: result[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
