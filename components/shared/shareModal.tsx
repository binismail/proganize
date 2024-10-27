import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/instance";
import { useAppContext } from "@/app/context/appContext";
import { Trash2Icon } from "lucide-react"; // Import the trash icon
import { Spinner } from "./spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch"; // Import the Switch component

// Add this import

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

export function ShareModal({ isOpen, onClose, documentId }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const { toast } = useToast();
  const { state } = useAppContext();
  const { user, subscriptionStatus } = state;
  const [isOwner, setIsOwner] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [activeTab, setActiveTab] = useState("invite");
  const [isPublic, setIsPublic] = useState(false);
  const [publicLink, setPublicLink] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [documentName, setDocumentName] = useState(""); // Add state for document name

  const isActiveSubscription = subscriptionStatus === "active";

  useEffect(() => {
    if (isOpen) {
      fetchPendingInvitations();
      fetchDocumentStatus();
      fetchDocumentDetails(); // Fetch document details
    }
  }, [isOpen, documentId]);

  const fetchPendingInvitations = async () => {
    const { data, error } = await supabase
      .from("document_invitations")
      .select("*")
      .eq("document_id", documentId)
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching pending invitations:", error);
    } else {
      setPendingInvitations(data);
    }
  };

  const fetchDocumentStatus = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("is_public")
      .eq("id", documentId)
      .single();

    if (error) {
      console.error("Error fetching document status:", error);
    } else {
      setIsPublic(data?.is_public || false);
      if (data?.is_public) {
        setPublicLink(`${window.location.origin}/public/${documentId}`);
      } else {
        setPublicLink("");
      }
    }
  };

  const fetchDocumentDetails = async () => {
    // Create a new function to fetch document details
    const { data, error } = await supabase
      .from("documents")
      .select("title") // Assuming the column for the document name is 'name'
      .eq("id", documentId)
      .single();

    if (error) {
      console.error("Error fetching document details:", error);
    } else {
      setDocumentName(data?.title || ""); // Set the document name
    }
  };

  const inviteCollaborator = async () => {
    if (!email || !documentId) return;
    setIsInviting(true);

    try {
      // Check if the user has an active subscription or if they haven't reached the limit
      if (!isActiveSubscription) {
        const { count, error: countError } = await supabase
          .from("document_collaborators")
          .select("*", { count: "exact", head: true })
          .eq("document_id", documentId);

        if (countError) throw countError;

        if (count !== null && count >= 3) {
          // Assuming free users can invite up to 3 collaborators
          toast({
            title: "Limit reached",
            description: "Upgrade to invite more collaborators",
            variant: "destructive",
          });
          setIsInviting(false);
          return;
        }
      }

      // Check if the invited email is the same as the current user's email
      if (email.toLowerCase() === user.email.toLowerCase()) {
        toast({
          title: "Invalid invitation",
          description: "You cannot invite yourself as a collaborator.",
          variant: "destructive",
        });
        return;
      }

      // Check if the user is already a collaborator
      const { data: existingCollaborator, error: collaboratorError } =
        await supabase
          .from("document_collaborators")
          .select("*")
          .eq("document_id", documentId)
          .eq("user_id", user.id)
          .single();

      if (collaboratorError && collaboratorError.code !== "PGRST116") {
        throw collaboratorError;
      }

      if (existingCollaborator) {
        toast({
          title: "Already a collaborator",
          description: "This user is already a collaborator on this document.",
          variant: "default",
        });
        return;
      }

      // Create a pending invitation in Supabase
      const { data, error } = await supabase
        .from("document_invitations")
        .insert({
          document_id: documentId,
          invited_email: email,
          status: "pending",
          role: role, // Save the selected role
        })
        .select()
        .single();

      if (error) throw error;

      // Generate invite link
      const inviteLink = `${window.location.origin}/accept-invitation/${data.id}`;

      // Send invitation email using our API route
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          inviterName: user.user_metadata.full_name,
          documentName: documentName, // Replace with actual document name
          inviteLink: inviteLink,
          role: role, // Include the role in the email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error("Failed to send invitation email");
      } else {
        toast({
          title: "Invitation sent",
          description: `An invitation has been sent to ${email} as a ${role}`,
          variant: "default",
        });
      }

      setEmail("");
      setRole("viewer"); // Reset role to default after sending

      // After successful invitation:
      fetchPendingInvitations();
      setIsInviting(false);
    } catch (error) {
      console.error("Error inviting collaborator:", error);
      toast({
        title: "Error inviting collaborator",
        description: "Please try again later",
        variant: "destructive",
      });
      setIsInviting(false);
    }
  };

  const notifyInvitee = async (invitationId: string) => {
    try {
      // Fetch the invitation details
      const { data: invitation, error: invitationError } = await supabase
        .from("document_invitations")
        .select("*")
        .eq("id", invitationId)
        .single();

      if (invitationError) throw invitationError;

      // Generate invite link
      const inviteLink = `${window.location.origin}/accept-invitation/${invitation.id}`;

      // Send notification email using your API route
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: invitation.invited_email,
          inviterName: user.user_metadata.full_name,
          documentName: "Your Document", // Replace with actual document name
          inviteLink: inviteLink,
          role: invitation.role,
          isReminder: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification email");
      }

      toast({
        title: "Notification sent",
        description: `A reminder has been sent to ${invitation.invited_email}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error notifying invitee:", error);
      toast({
        title: "Error sending notification",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    if (!isOwner) {
      toast({
        title: "Permission denied",
        description: "Only the document owner can delete invitations.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("document_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation deleted",
        description: "The invitation has been removed.",
        variant: "default",
      });

      // Refresh the list of pending invitations
      fetchPendingInvitations();
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast({
        title: "Error deleting invitation",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const togglePublicAccess = async () => {
    // if (!isActiveSubscription) {
    //   toast({
    //     title: "Feature not available",
    //     description: "Upgrade to share documents publicly",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    setIsUpdating(true);
    const newPublicStatus = !isPublic;
    const { error } = await supabase
      .from("documents")
      .update({ is_public: newPublicStatus })
      .eq("id", documentId);

    if (error) {
      console.error("Error updating document status:", error);
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      });
    } else {
      setIsPublic(newPublicStatus);
      if (newPublicStatus) {
        setPublicLink(`${window.location.origin}/public/${documentId}`);
        toast({
          title: "Success",
          description: "Document is now public",
          variant: "default",
        });
      } else {
        setPublicLink("");
        toast({
          title: "Success",
          description: "Document is now private",
          variant: "default",
        });
      }
    }
    setIsUpdating(false);
  };

  useEffect(() => {
    const checkOwnership = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("user_id")
        .eq("id", documentId)
        .single();

      if (data && !error) {
        setIsOwner(data.user_id === user.id);
      }
    };

    checkOwnership();
  }, [documentId, user.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='invite'>Invite</TabsTrigger>
            <TabsTrigger value='public'>Share to Web</TabsTrigger>
          </TabsList>
          <TabsContent value='invite'>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Input
                  id='email'
                  className='col-span-4'
                  placeholder='Enter email address'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Select onValueChange={setRole} value={role}>
                  <SelectTrigger className='col-span-4'>
                    <SelectValue placeholder='Select a role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='viewer'>Viewer</SelectItem>
                    <SelectItem value='editor'>Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={inviteCollaborator} disabled={isInviting}>
              {isInviting ? (
                <>
                  <Spinner size='sm' />
                </>
              ) : (
                "Invite"
              )}
            </Button>
            {!isActiveSubscription && (
              <p className='text-sm text-gray-500 mt-2'>
                You can invite up to 3 collaborators. Upgrade for unlimited
                invitations.
              </p>
            )}
            {pendingInvitations.length > 0 && (
              <div className='mt-4'>
                <h3 className='text-sm font-semibold'>Pending Invitations</h3>
                <ul className='mt-2 space-y-2'>
                  {pendingInvitations.map((invitation) => (
                    <li
                      key={invitation.id}
                      className='flex items-center justify-between'
                    >
                      <span>
                        {invitation.invited_email} ({invitation.role})
                      </span>
                      <div className='flex space-x-2'>
                        <Button
                          size='sm'
                          onClick={() => notifyInvitee(invitation.id)}
                        >
                          Notify
                        </Button>
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => deleteInvitation(invitation.id)}
                        >
                          <Trash2Icon className='h-4 w-4' />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          <TabsContent value='public'>
            <div className='grid gap-4 py-4'>
              <div className='flex items-center justify-between'>
                <span>Make document public</span>
                <Switch
                  checked={isPublic}
                  onCheckedChange={togglePublicAccess}
                  disabled={isUpdating}
                />
              </div>
              {isPublic && (
                <>
                  <Input value={publicLink} readOnly />
                  <Button
                    onClick={() => navigator.clipboard.writeText(publicLink)}
                  >
                    Copy Link
                  </Button>
                </>
              )}
              {isUpdating && <Spinner />}
              {/* {!isActiveSubscription && (
                <p className='text-sm text-blue-500 text-center'>
                  Upgrade to share documents publicly.
                </p>
              )} */}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
