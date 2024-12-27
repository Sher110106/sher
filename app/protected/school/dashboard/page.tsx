import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation";
import { InfoIcon} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default async function School(){
    const supabase=await createClient();
    const {
        data:{user} 
    }=await supabase.auth.getUser();
    if(!user){
        redirect('/sign-in')

    }
    return(
        <div className="flex-1 w-full flex flex-col gap-12">
        <div className="w-full">
          <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
            <InfoIcon size="16" strokeWidth={2} />
            This is a protected page that you can only see as an authenticated
            user
          </div>
        </div>
        <div className="flex flex-col gap-2 items-start">
          <h2 className="font-bold text-2xl mb-4">School</h2>
          <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
            Hey as you are a School you can access the teachers from the below button
          </pre>
          <div className="pt-5">
          <Link  href="/protected/school/teachers">
            <Button>Search For Teachers</Button>
          </Link>
          </div>
        </div>
        
      </div>
        
    )
};