"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/instance";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/shared/spinner";

export default function AcceptInvitation() {
  const router = useRouter();
  const { id } = useParams(); // Use useParams to get the dynamic ID
  const [invitation, setInvitation] = useState(null) as any;
  const [user, setUser] = useState(null) as any;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    if (id) {
      fetchInvitation();
      checkUser();
    }
  }, [id]);

  const fetchInvitation = async () => {
    const { data, error } = await supabase
      .from("document_invitations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching invitation:", error);
      toast({
        title: "Error fetching invitation",
        description: "Please try again later",
        variant: "destructive",
      });
    } else {
      setInvitation(data);
    }
  };

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/accept-invitation/${id}`,
      },
    });

    if (error) {
      console.error("Error signing in with Google:", error);
      toast({
        title: "Error signing in",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const acceptInvitation = async () => {
    setLoading(true); // Set loading to true when starting the process
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to accept the invitation",
        variant: "default",
      });
      setLoading(false); // Reset loading state
      return;
    }

    try {
      // Check if user profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error checking existing profile:", profileError);
        throw profileError;
      }

      // If profile doesn't exist, create one
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          });

        if (insertError) {
          console.error("Error inserting user profile:", insertError);
          throw insertError;
        }
      }

      // Fetch the user profile ID
      const { data: userProfile, error: userProfileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (userProfileError) {
        console.error("Error fetching user profile:", userProfileError);
        throw userProfileError;
      }

      // Add user as collaborator
      const { error: collaboratorError } = await supabase
        .from("document_collaborators")
        .insert({
          document_id: invitation.document_id,
          user_id: user.id,
          user_profile_id: userProfile.id,
          role: invitation.role,
        });

      if (collaboratorError) {
        console.error("Error adding collaborator:", collaboratorError);
        throw collaboratorError;
      }

      // Update invitation status
      const { error: invitationError } = await supabase
        .from("document_invitations")
        .update({ status: "accepted" })
        .eq("id", id);

      if (invitationError) {
        console.error("Error updating invitation status:", invitationError);
        throw invitationError;
      }

      toast({
        title: "Invitation accepted",
        description: "You are now a collaborator on this document",
        variant: "default",
      });

      // Redirect to the main app
      router.push("/");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error accepting invitation",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false); // Reset loading state after process completes
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-300'>
      {invitation ? (
        <div className='p-8 bg-white rounded-lg shadow-md w-[500px]'>
          <h1 className='text-2xl font-bold mb-4'>Pending Invitation</h1>
          <p className='mb-4'>
            <b>Khalid Ismail</b> has invited you to collaborate on
            <b>{" Proganize Document"}</b> together.
          </p>
          {user ? (
            <div className='w-full flex gap-6 mx-auto'>
              <Button onClick={acceptInvitation} disabled={loading}>
                {loading ? <Spinner size='sm' /> : "Accept Invitation"}{" "}
                {/* Show loader */}
              </Button>
              <Button variant='outline' onClick={() => {}}>
                Decline
              </Button>
            </div>
          ) : (
            <div>
              <p className='mb-4'>
                We noticed you're not logged in, login to with google to accept
                invitation, if you don't have an account no worries we will
                create an account for you
              </p>
              <Button onClick={signInWithGoogle}>Sign in with Google</Button>
            </div>
          )}
        </div>
      ) : (
        <Spinner size='lg' />
      )}
    </div>
  );
}
