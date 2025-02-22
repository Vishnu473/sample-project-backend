//Higher Order Function that will take care of exceptions
//Higher Order funcs - Function inside a function
//The following handles both async and non-async functions
export const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch((err) => next(err))
    }
}
