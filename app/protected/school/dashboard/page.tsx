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
       
        <div className="flex flex-col gap-2 items-start">
          <h2 className="font-bold text-2xl mb-4">School</h2>
          <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
            Hey as you are a School you can access the teachers from the below button
          </pre>
          <div className="pt-5 flex-col ">
            <div>
            <Link  href="/protected/school/teachers">
              <Button>Search For Teachers</Button>
            </Link>
            </div>
            <div className='pt-5 pb-5'>
            <Link  href="/protected/school/edit" >
              <Button>Edit your profile</Button>
            </Link>
            </div>
            <div>
            <Link  href="/protected/school/past_classes" >
              <Button>Past Classes</Button>
            </Link>
            </div>

          </div>
        </div>
        
      </div>
        
    )
};