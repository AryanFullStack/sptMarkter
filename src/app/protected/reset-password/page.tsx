import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/app/actions";
import Navbar from "@/components/navbar";

export default async function ResetPassword(props: {
    searchParams: Promise<Message>;
}) {
    const searchParams = await props.searchParams;

    if ("message" in searchParams) {
        return (
            <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
                <FormMessage message={searchParams} />
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
                <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
                    <form className="flex flex-col space-y-6">
                        <div className="space-y-2 text-center">
                            <h1 className="text-3xl font-semibold tracking-tight">Reset Password</h1>
                            <p className="text-sm text-muted-foreground">
                                Enter your new password below.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    type="password"
                                    name="password"
                                    placeholder="New password"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm password"
                                    required
                                />
                            </div>
                        </div>

                        <SubmitButton
                            formAction={resetPasswordAction}
                            pendingText="Resetting password..."
                            className="w-full"
                        >
                            Reset Password
                        </SubmitButton>

                        <FormMessage message={searchParams} />
                    </form>
                </div>
            </div>
        </>
    );
}
