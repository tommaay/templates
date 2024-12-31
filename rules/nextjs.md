# Project Instructions

Use specification and guidelines as you build the app.

Write the complete code for every step. Do not get lazy.

Your goal is to completely finish whatever I ask for.

You will see <ai_context> tags in the code. These are context tags that you should use to help you understand the codebase.

## Overview

This is a web app template.

## Tech Stack

- Frontend: Next.js, Tailwind, Shadcn, Framer Motion
- Backend: Postgres, Supabase, Drizzle ORM, Server Actions
- Auth: Clerk
- Payments: Stripe
- Analytics: PostHog
- Deployment: Vercel

## Project Structure

- `public/` - Static assets (stays at root)
- `src/` - Application source code
  - `actions/` - Server actions
    - `db/` - Database related actions
    - Other actions
  - `app/` - Next.js app router
    - `api/` - API routes
    - `route/` - An example route
      - `_components/` - One-off components for the route
      - `layout.tsx` - Layout for the route
      - `page.tsx` - Page for the route
  - `components/` - Shared components
    - `ui/` - UI components
    - `utilities/` - Utility components
  - `db/` - Database
    - `schema/` - Database schemas
  - `lib/` - Library code
    - `hooks/` - Custom hooks
  - `prompts/` - Prompt files
  - `types/` - Type definitions

## Rules

Follow these rules when building the app.

### General Rules

- Use `@` to import anything from the app unless otherwise specified
- Use kebab case for all files and folders unless otherwise specified
- Don't update shadcn components unless otherwise specified

#### Env Rules

- If you update environment variables, update the `.env.example` file
- All environment variables should go in `.env.local`
- Do not expose environment variables to the frontend
- Use `NEXT_PUBLIC_` prefix for environment variables that need to be accessed from the frontend
- You may import environment variables in server actions and components by using `process.env.VARIABLE_NAME`

#### Type Rules

Follow these rules when working with types.

- When importing types, use `@/types`
- Name files like `example-types.ts`
- All types should go in `types`
- Make sure to export the types in `types/index.ts`
- Prefer interfaces over type aliases
- If referring to db types, use `@/db/schema` such as `SelectTodo` from `todos-schema.ts`

An example of a type:

`types/actions-types.ts`

```ts
export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never };
```

And exporting it:

`types/index.ts`

```ts
export * from "./actions-types";
```

### Frontend Rules

Follow these rules when working on the frontend.

It uses Next.js, Tailwind, Shadcn, and Framer Motion.

#### General Rules

- Use `lucide-react` for icons

#### Components

- Use divs instead of other html tags unless otherwise specified
- Separate the main parts of a component's html with an extra blank line for visual spacing
- Always tag a component with either `use server` or `use client` at the top, including layouts and pages

##### Organization

- All components be named using kebab case like `example-component.tsx` unless otherwise specified
- Put components in `/_components` in the route if one-off components
- Put components in `/components` from the root if shared components

##### Data Fetching

- Fetch data in server components and pass the data down as props to client components.
- Use server actions from `/actions` to mutate data.

##### Server Components

- Use `"use server"` at the top of the file.
- Implement Suspense for asynchronous data fetching to show loading states while data is being fetched.
- If no asynchronous logic is required for a given server component, you do not need to wrap the component in `<Suspense>`. You can simply return the final UI directly since there is no async boundary needed.
- If asynchronous fetching is required, you can use a `<Suspense>` boundary and a fallback to indicate a loading state while data is loading.
- Server components cannot be imported into client components. If you want to use a server component in a client component, you must pass the as props using the "children" prop

Example of a server layout:

```tsx
"use server";

export default async function ExampleServerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

Example of a server page (with async logic):

```tsx
"use server";

import { Suspense } from "react";
import { SomeAction } from "@/actions/some-actions";
import SomeComponent from "./_components/some-component";
import SomeSkeleton from "./_components/some-skeleton";

export default async function ExampleServerPage() {
  return (
    <Suspense fallback={<SomeSkeleton className="some-class" />}>
      <SomeComponentFetcher />
    </Suspense>
  );
}

async function SomeComponentFetcher() {
  const { data } = await SomeAction();
  return <SomeComponent className="some-class" initialData={data || []} />;
}
```

Example of a server page (no async logic required):

```tsx
"use server";

import SomeClientComponent from "./_components/some-client-component";

// In this case, no asynchronous work is being done, so no Suspense or fallback is required.
export default async function ExampleServerPage() {
  return <SomeClientComponent initialData={[]} />;
}
```

Example of a server component:

```tsx
"use server";

interface ExampleServerComponentProps {
  // Your props here
}

export async function ExampleServerComponent({ props }: ExampleServerComponentProps) {
  // Your code here
}
```

##### Client Components

- Use `"use client"` at the top of the file
- Client components can safely rely on props passed down from server components, or handle UI interactions without needing <Suspense> if there’s no async logic.
- Use named exports for client components and default exports for page components.

Example of a client page:

```tsx
"use client";

export default function ExampleClientPage() {
  // Your code here
}
```

Example of a client component:

```tsx
"use client";

interface ExampleClientComponentProps {
  initialData: any[];
}

export function ExampleClientComponent({ initialData }: ExampleClientComponentProps) {
  // Client-side logic here
  return <div>{initialData.length} items</div>;
}
```

### Backend Rules

Follow these rules when working on the backend.

It uses Postgres, Supabase, Drizzle ORM, and Server Actions.

#### General Rules

- Never generate migrations. You do not have to do anything in the `db/migrations` folder inluding migrations and metadata. Ignore it.

#### Organization

#### Schemas

- When importing schemas, use `@/db/schema`
- Name files like `example-schema.ts`
- All schemas should go in `db/schema`
- Make sure to export the schema in `db/schema/index.ts`
- Make sure to add the schema to the `schema` object in `db/db.ts`
- If using a userId, always use `userId: text("user_id").notNull()`
- Always include createdAt and updatedAt columns in all tables
- Make sure to cascade delete when necessary
- Use enums for columns that have a limited set of possible values such as:

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "pro"]);

membership: membershipEnum("membership").notNull().default("free");
```

Example of a schema:

`db/schema/todos-schema.ts`

```ts
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const todosTable = pgTable("todos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertTodo = typeof todosTable.$inferInsert;
export type SelectTodo = typeof todosTable.$inferSelect;
```

And exporting it:

`db/schema/index.ts`

```ts
export * from "./todos-schema";
```

And adding it to the schema in `db/db.ts`:

`db/db.ts`

```ts
import { todosTable } from "@/db/schema";

const schema = {
  todos: todosTable,
};
```

And a more complex schema:

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const chatsTable = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertChat = typeof chatsTable.$inferInsert;
export type SelectChat = typeof chatsTable.$inferSelect;
```

```ts
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chatsTable } from "./chats-schema";

export const roleEnum = pgEnum("role", ["assistant", "user"]);

export const messagesTable = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chatsTable.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertMessage = typeof messagesTable.$inferInsert;
export type SelectMessage = typeof messagesTable.$inferSelect;
```

And exporting it:

`db/schema/index.ts`

```ts
export * from "./chats-schema";
export * from "./messages-schema";
```

And adding it to the schema in `db/db.ts`:

`db/db.ts`

```ts
import { chatsTable, messagesTable } from "@/db/schema";

const schema = {
  chats: chatsTable,
  messages: messagesTable,
};
```

#### Server Actions

- When importing actions, use `@/actions` or `@/actions/db` if db related
- DB related actions should go in the `actions/db` folder
- Other actions should go in the `actions` folder
- Name files like `example-actions.ts`
- All actions should go in the `actions` folder
- Only write the needed actions
- Return an ActionState with the needed data type from actions
- Include Action at the end of function names `Ex: exampleFunction -> exampleFunctionAction`
- Actions should return a Promise<ActionState<T>>
- Sort in CRUD order: Create, Read, Update, Delete
- Make sure to return undefined as the data type if the action is not supposed to return any data

```ts
export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never };
```

Example of an action:

`actions/db/todos-actions.ts`

```ts
"use server";

import { db } from "@/db/db";
import { InsertTodo, SelectTodo, todosTable } from "@/db/schema/todos-schema";
import { ActionState } from "@/types";
import { eq } from "drizzle-orm";

export async function createTodoAction(todo: InsertTodo): Promise<ActionState<SelectTodo>> {
  try {
    const [newTodo] = await db.insert(todosTable).values(todo).returning();
    return {
      isSuccess: true,
      message: "Todo created successfully",
      data: newTodo,
    };
  } catch (error) {
    console.error("Error creating todo:", error);
    return { isSuccess: false, message: "Failed to create todo" };
  }
}

export async function getTodosAction(userId: string): Promise<ActionState<SelectTodo[]>> {
  try {
    const todos = await db.query.todos.findMany({
      where: eq(todosTable.userId, userId),
    });
    return {
      isSuccess: true,
      message: "Todos retrieved successfully",
      data: todos,
    };
  } catch (error) {
    console.error("Error getting todos:", error);
    return { isSuccess: false, message: "Failed to get todos" };
  }
}

export async function updateTodoAction(
  id: string,
  data: Partial<InsertTodo>
): Promise<ActionState<SelectTodo>> {
  try {
    const [updatedTodo] = await db
      .update(todosTable)
      .set(data)
      .where(eq(todosTable.id, id))
      .returning();

    return {
      isSuccess: true,
      message: "Todo updated successfully",
      data: updatedTodo,
    };
  } catch (error) {
    console.error("Error updating todo:", error);
    return { isSuccess: false, message: "Failed to update todo" };
  }
}

export async function deleteTodoAction(id: string): Promise<ActionState<void>> {
  try {
    await db.delete(todosTable).where(eq(todosTable.id, id));
    return {
      isSuccess: true,
      message: "Todo deleted successfully",
      data: undefined,
    };
  } catch (error) {
    console.error("Error deleting todo:", error);
    return { isSuccess: false, message: "Failed to delete todo" };
  }
}
```

### Auth Rules

Follow these rules when working on auth.

It uses Clerk for authentication.

#### General Rules

- Import the auth helper with `import { auth } from "@clerk/nextjs/server"` in server components
- await the auth helper in server actions

### Payments Rules

Follow these rules when working on payments.

It uses Stripe for payments.

### Analytics Rules

Follow these rules when working on analytics.

It uses PostHog for analytics.