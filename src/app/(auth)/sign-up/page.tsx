import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";
import { MainNav } from "@/components/main-nav";
import { UrlProvider } from "@/components/url-provider";

export default async function Signup(props: {
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
      <MainNav />
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-charcoal/10 bg-white p-8 shadow-sm">
          <UrlProvider>
            <form className="flex flex-col space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="font-display text-3xl font-bold tracking-tight text-charcoal">
                  Create Account
                </h1>
                <p className="text-sm text-charcoal-light">
                  Already have an account?{" "}
                  <Link
                    className="text-gold font-medium hover:underline transition-all"
                    href="/sign-in"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+92 300 1234567"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">
                    Account Type
                  </Label>
                  <Select name="role" defaultValue="local_customer">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local_customer">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Local Customer</span>
                          <span className="text-xs text-charcoal-light">
                            Retail pricing for individual purchases
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="retailer">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Retailer</span>
                          <span className="text-xs text-charcoal-light">
                            Wholesale discounts for resellers
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="beauty_parlor">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Beauty Parlor</span>
                          <span className="text-xs text-charcoal-light">
                            Best prices for beauty businesses
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-charcoal-light mt-1">
                    Business accounts require verification
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line1" className="text-sm font-medium">
                    Address
                  </Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    type="text"
                    placeholder="Street Address, Shop Number"
                    required
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="City"
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code" className="text-sm font-medium">
                      Postal Code
                    </Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      type="text"
                      placeholder="Zip Code"
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">
                      State/Province
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      placeholder="State"
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_type" className="text-sm font-medium">
                      Address Type
                    </Label>
                    <Select name="address_type" defaultValue="home">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="shop">Shop</SelectItem>
                        <SelectItem value="beauty_parlor">Beauty Parlor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Your password"
                    minLength={6}
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <SubmitButton
                formAction={signUpAction}
                pendingText="Creating account..."
                className="w-full bg-gold hover:bg-gold-dark text-white"
              >
                Create Account
              </SubmitButton>

              <FormMessage message={searchParams} />
            </form>
          </UrlProvider>
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}
