"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FileText, UploadCloud, File, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import merchantApi from "@/lib/merchant-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function MerchantKycPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<{
    business_certificate: File | null;
    id_card: File | null;
    proof_of_address: File | null;
  }>({
    business_certificate: null,
    id_card: null,
    proof_of_address: null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Basic 5MB limit check
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 5MB size limit.`);
        e.target.value = "";
        return;
      }
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files.business_certificate || !files.id_card || !files.proof_of_address) {
      toast.error("Please provide all 3 required documents.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("business_certificate", files.business_certificate);
      formData.append("id_card", files.id_card);
      formData.append("proof_of_address", files.proof_of_address);

      const response = await merchantApi.post("/merchants/kyc/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("KYC documents submitted successfully!");
        router.push("/merchant");
      } else {
        toast.error("Failed to submit documents.");
      }
    } catch (error: any) {
      console.error("KYC upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload KYC documents. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/merchant">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compliance &amp; Verification</h1>
          <p className="text-sm text-muted-foreground">
            Upload your business verification documents to unlock full merchant capabilities.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Secure Uploads</p>
          <p>
            Your documents are encrypted and stored securely. They are only reviewed by our compliance team 
            to verify your business identity and meet regulatory requirements.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>
              Please upload clear, legible copies of the following documents. Maximum file size is 5MB per file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Certificate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="business_certificate" className="text-base">1. Business Registration Certificate</Label>
                {files.business_certificate && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <p className="text-sm text-muted-foreground">
                Official certificate of incorporation or business registration from your local government authority.
              </p>
              <div className="flex items-center gap-4">
                <Input
                  id="business_certificate"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="max-w-md cursor-pointer"
                  onChange={(e) => handleFileChange(e, "business_certificate")}
                  required
                />
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* ID Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="id_card" className="text-base">2. Government-issued ID</Label>
                {files.id_card && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <p className="text-sm text-muted-foreground">
                Valid Passport, National ID, or Driver's License of the business owner or primary director.
              </p>
              <div className="flex items-center gap-4">
                <Input
                  id="id_card"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="max-w-md cursor-pointer"
                  onChange={(e) => handleFileChange(e, "id_card")}
                  required
                />
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* Proof of Address */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="proof_of_address" className="text-base">3. Proof of Address</Label>
                {files.proof_of_address && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <p className="text-sm text-muted-foreground">
                Recent utility bill, bank statement, or lease agreement (issued within the last 3 months).
              </p>
              <div className="flex items-center gap-4">
                <Input
                  id="proof_of_address"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="max-w-md cursor-pointer"
                  onChange={(e) => handleFileChange(e, "proof_of_address")}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t flex items-center justify-between p-6">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Review typically takes 1-2 business days.
            </p>
            <Button type="submit" disabled={isSubmitting || !files.business_certificate || !files.id_card || !files.proof_of_address}>
              {isSubmitting ? (
                <>
                  <UploadCloud className="mr-2 h-4 w-4 animate-bounce" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Submit Documents
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
