import { Vendor } from "@/types/vendor";
import { fetchAuthSession } from 'aws-amplify/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

const getAuthToken = async () => {
    try {
        const session = await fetchAuthSession();
        // this is the identity token that Cognito Authorizer looks for
        return session.tokens?.idToken?.toString();
    } catch (err) {
        console.error("No active session", err);
        return null;
    }
};

export const getVendors = async (): Promise<Vendor[]> => {
    const response = await fetch(`${BASE_URL}/vendors`);
    if (!response.ok) throw new Error("Failed to fetch");
    return response.json();
};

export const createVendor = async (vendor: Vendor) => {
    const token = await getAuthToken();
    const response = await fetch(`${BASE_URL}/vendors`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token || ""
        },
        body: JSON.stringify(vendor),
    });

    if (!response.ok) throw new Error("Failed to create vendor");
    return response.json();
};

export const deleteVendor = async (vendorId: string) => {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    const response = await fetch(`${BASE_URL}/vendors`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token || ""
        },
        body: JSON.stringify({ vendorId }),
    });

    if (!response.ok) throw new Error("Failed to delete vendor");
    return response.json();
};


export const updateVendor = async (
    vendorId: string,
    updates: Partial<Omit<Vendor, 'vendorId' | 'createdAt'>>
): Promise<void> => {
    const token = await getAuthToken();
    const response = await fetch(`${BASE_URL}/vendors`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: token || "",
        },
        body: JSON.stringify({ vendorId, ...updates }),
    });
    if (!response.ok) throw new Error('Failed to update vendor');
};
