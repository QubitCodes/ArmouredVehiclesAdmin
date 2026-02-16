import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * GET /api/pdf/[filename]
 * Serves PDF files from the public directory with correct Content-Type headers.
 * This bypasses Next.js page routing which would otherwise redirect to the login page.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ filename: string }> }
) {
	try {
		const { filename } = await params;

		// Sanitize filename to prevent directory traversal
		const sanitized = path.basename(filename);
		if (!sanitized.endsWith('.pdf')) {
			return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
		}

		const filePath = path.join(process.cwd(), 'public', sanitized);
		const fileBuffer = await readFile(filePath);

		return new NextResponse(fileBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `inline; filename="${sanitized}"`,
				'Cache-Control': 'public, max-age=3600',
			},
		});
	} catch (error: any) {
		if (error.code === 'ENOENT') {
			return NextResponse.json({ error: 'File not found' }, { status: 404 });
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
