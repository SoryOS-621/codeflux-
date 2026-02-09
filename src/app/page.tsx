"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";


const Page = () => {
  // const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const trpc = useTRPC();

  const {data: messages} = useQuery(trpc.messages.getMany.queryOptions()) 

  const createMessage = useMutation(trpc.messages.create.mutationOptions({
    onSuccess: ()=>{
      toast.success("Message created");
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
      <Button disabled={createMessage.isPending} onClick={() => createMessage.mutate({value: description})}>
        Invoke Create Message
      </Button>

      {JSON.stringify(messages, null, 2)}
    
    </div>

    
  );
};

export default Page;