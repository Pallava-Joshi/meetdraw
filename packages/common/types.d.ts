import { z } from "zod";
export declare const UserSignupSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    username: string;
    password: string;
}, {
    name: string;
    username: string;
    password: string;
}>;
export declare const UserSigninSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export declare const CreateRoomSchema: z.ZodObject<{
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
}, {
    title: string;
}>;
export declare const JoinRoomSchema: z.ZodObject<{
    joinCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    joinCode: string;
}, {
    joinCode: string;
}>;
export declare const WebSocketMessageSchema: z.ZodObject<{
    type: z.ZodEnum<["connect_room", "disconnect_room", "chat_message", "draw", "error_message"]>;
    roomId: z.ZodString;
    userId: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    roomId: string;
    type: "draw" | "connect_room" | "disconnect_room" | "chat_message" | "error_message";
    content?: string | undefined;
}, {
    userId: string;
    roomId: string;
    type: "draw" | "connect_room" | "disconnect_room" | "chat_message" | "error_message";
    content?: string | undefined;
}>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
//# sourceMappingURL=types.d.ts.map