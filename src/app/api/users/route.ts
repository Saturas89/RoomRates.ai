import { NextResponse } from 'next/server';

type User = {
    id: number;
    name: string;
    email: string;
};

const users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

export async function GET() {
    return NextResponse.json(users);
}

export async function POST(request: Request) {
    const newUser: User = await request.json();
    users.push(newUser);
    return NextResponse.json(newUser, { status: 201 });
}