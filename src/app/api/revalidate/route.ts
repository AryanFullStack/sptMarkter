import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const tag = searchParams.get("tag");
    const path = searchParams.get("path");

    // Validate secret
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    if (tag) {
      revalidateTag(tag);
      console.log(`[Revalidate] Tag: ${tag}`);
      return NextResponse.json({ revalidated: true, tag, now: Date.now() });
    }

    if (path) {
      // If path is provided, revalidate that specific path
      // Third argument can be 'page' or 'layout'
      const type = (searchParams.get("type") as "page" | "layout" | null) || "page";
      revalidatePath(path, type);
      console.log(`[Revalidate] Path: ${path} (${type})`);
      return NextResponse.json({ revalidated: true, path, type, now: Date.now() });
    }

    // Also support JSON body for Supabase webhooks
    const body = await req.json().catch(() => ({}));
    if (body.table) {
      // Generic mapping from table to revalidation tags
      // For example, if 'orders' table changes, revalidate 'orders' tag
      revalidateTag(body.table);
      console.log(`[Revalidate] Body Table: ${body.table}`);
      
      // Also revalidate dashboard if orders change
      if (body.table === 'orders' || body.table === 'payments') {
        revalidateTag('dashboard');
      }

      return NextResponse.json({ revalidated: true, table: body.table, now: Date.now() });
    }

    return NextResponse.json({ message: "Missing tag, path, or valid JSON body" }, { status: 400 });
  } catch (err) {
    console.error("[Revalidate Error]", err);
    return NextResponse.json({ message: "Revalidation failed" }, { status: 500 });
  }
}

// Support GET for easy manual testing in browser (if needed, but POST is safer for webhooks)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const tag = searchParams.get("tag");
    const path = searchParams.get("path");

    if (secret !== process.env.REVALIDATION_SECRET) {
        return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    if (tag) {
        revalidateTag(tag);
        return NextResponse.json({ revalidated: true, tag });
    }

    if (path) {
        revalidatePath(path);
        return NextResponse.json({ revalidated: true, path });
    }

    return NextResponse.json({ message: "Missing tag or path" }, { status: 400 });
}
