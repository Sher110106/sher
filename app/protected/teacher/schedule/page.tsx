import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TimeSlotInput from "./schedule";

export default async function scheduleDashboard(){
    const supabase=await createClient();
    const {
        data:{user} 
    }=await supabase.auth.getUser();
    if(!user){
        redirect('/sign-in')

    }
    
    return(
        <>

            <TimeSlotInput teacherId={user.id} ></TimeSlotInput>
        </>
    )
}