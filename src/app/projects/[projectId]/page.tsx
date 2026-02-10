interface props {
    params: Promise<{
        projectId:string
    }>
}

const Page = async ({params}: props) => {
    const {projectId} = await params;
    return (
        <div>
            ProjectId : {projectId}
        </div>
    )
}

export default Page;
