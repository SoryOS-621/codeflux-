"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";


const Page = () => {
  // const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const trpc = useTRPC();
  // const invoke = useMutation(trpc.invoke.mutationOptions({
  //   onSuccess: ()=>{
  //     toast.success("Background Job Started");
  //   }
  // }));
  const invokeWriter = useMutation(trpc.invokeWriter.mutationOptions({
    onSuccess: ()=>{
      toast.success("Background Job Started");
    }
  }));
  return (
    <div>
      {/* <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button disabled={invoke.isPending} onClick={() => invoke.mutate({value: value})}>
        Invoke Background Job
      </Button> */}

      {/* <br /><br /><br /> */}
      <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      <Button disabled={invokeWriter.isPending} onClick={() => invokeWriter.mutate({value: description})}>
        Invoke Writer Background Job
      </Button>
    
    </div>

    
  );
};

export default Page;