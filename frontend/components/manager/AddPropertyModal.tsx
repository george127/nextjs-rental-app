"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AddPropertyModal({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false);

  // Store actual File
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    rentAmount: "",
    securityDeposit: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    description: "",
    propertyType: "",
    amenities: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
  };

const handleSubmit = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized. Please log in.");
      return;
    }

    let imageData: string | null = null;

    // Convert image to base64 FIRST
    if (imageFile) {
      imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }

    const res = await fetch("http://localhost:5000/api/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        rentAmount: Number(form.rentAmount),
        securityDeposit: Number(form.securityDeposit),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        squareFeet: form.squareFeet ? Number(form.squareFeet) : null,
        amenities: form.amenities
          ? form.amenities.split(",").map((a) => a.trim())
          : [],
        imageData, // ✅ now properly included
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to add property");
      return;
    }

    alert("Property added successfully!");
    onCreated(); // better than location.reload()
  } catch (error) {
    console.error(error);
    alert("Server error");
  } finally {
    setLoading(false);
  }
};

  const sendRequest = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized. Please log in.");
      return;
    }

    const res = await fetch("http://localhost:5000/api/properties", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // ✅ send token
        // ❌ Do NOT set Content-Type manually when using FormData
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to add property");
      return;
    }

    alert("Property added successfully!");
    location.reload();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Property</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[93vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <Input name="name" placeholder="Property Name" onChange={handleChange} />
          <Input name="address" placeholder="Street Address" onChange={handleChange} />

          <div className="flex gap-3">
            <Input name="city" placeholder="City" onChange={handleChange} />
            <Input name="state" placeholder="State" onChange={handleChange} />
            <Input name="zipCode" placeholder="Zip Code" onChange={handleChange} />
          </div>

          <div className="flex gap-3">
            <Input name="rentAmount" placeholder="Rent Amount" type="number" onChange={handleChange} />
            <Input name="securityDeposit" placeholder="Security Deposit" type="number" onChange={handleChange} />
          </div>

          <div className="flex gap-3">
            <Input name="bedrooms" placeholder="Bedrooms" type="number" onChange={handleChange} />
            <Input name="bathrooms" placeholder="Bathrooms" type="number" onChange={handleChange} />
            <Input name="squareFeet" placeholder="Square Feet" type="number" onChange={handleChange} />
          </div>

          <Input
            name="propertyType"
            placeholder="Property Type (Apartment, House, Condo)"
            onChange={handleChange}
          />

          <Textarea
            name="description"
            placeholder="Property description"
            className="min-h-[100px]"
            onChange={handleChange}
          />

          <Input
            name="amenities"
            placeholder="Amenities (Parking, Pool, Gym)"
            onChange={handleChange}
          />

          <Input type="file" accept="image/*" onChange={handleImageUpload} />

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full md:w-fit self-end"
          >
            {loading ? "Saving..." : "Save Property"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
