"use client"

import { setSort } from "@/lib/slices/appSlices"
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux"


interface Props {
    className?: string,
    serverArg: string, 
    name: string
}

export function Sort({className, serverArg, name} : Props){
    const dispatch = useAppDispatch()
    const sort = useAppSelector((state) => state.app.sort)

    function toggleStock(){
        if(sort == `${serverArg}Asc`){
            dispatch(setSort(`${serverArg}Desc`))
        }else{
            dispatch(setSort(`${serverArg}Asc`))
        }
    }

    return(
        <button onClick={toggleStock} className={className}>
            {sort ==  `${serverArg}Desc` && <>↓ </>}
            {sort ==  `${serverArg}Asc` && <>↑ </>}
                {name}
        </button>
    )
}