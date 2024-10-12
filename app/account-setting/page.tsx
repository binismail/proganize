"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Nav from "@/components/layout/nav";
import { useAppContext } from "../context/appContext";

export default function BillingAndProfilePage() {
  const { state, dispatch } = useAppContext();
  const { user } = state;

  return (
    <>
      <Nav />
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-8'>Account Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Manage your account details and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-4'>
              <Avatar className='h-20 w-20'>
                <AvatarImage
                  src={user?.user_metadata.avatar_url}
                  alt={user?.user_metadata.full_name}
                />
                <AvatarFallback>
                  {user?.user_metadata.full_name
                    ?.split(" ")
                    .map((n: any) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button variant='outline'>Change Picture</Button>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input id='name' value={user?.user_metadata.full_name} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' value={user?.email} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='google-id'>Google ID</Label>
              <Input id='google-id' value={user?.googleId} disabled />
            </div>
            <div className='flex items-center space-x-2'>
              <Switch id='2fa' />
              <Label htmlFor='2fa'>Enable Two-Factor Authentication</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
