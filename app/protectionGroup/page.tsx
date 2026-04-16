'use client';
import PageFooter from "@/packages/ui/components/base/PageFooter";
import PageTemplate from "@/packages/ui/components/base/PageTemplate";
import ProtectionGroupHeader from "@/packages/ui/components/protectGroup/ProtectionGroupHeader";
import SearchSection from "@/packages/ui/components/protectGroup/SearchSection";
import { useState } from "react";



export default function ProtectionGroupPage() {
    const [searchQuery, setSearchQuery] = useState('');
    return (
        <main className="page-container-full">
            <PageTemplate>
                <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-6">
                    <ProtectionGroupHeader />
                    <SearchSection
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                </div>
            </PageTemplate>
            <PageFooter />
        </main>
    );
}