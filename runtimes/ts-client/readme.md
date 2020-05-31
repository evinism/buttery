# ts-client runtime

This contains a single file that is copied into the gen directory on genfile
creation. This was done because I thought it'd be less error-prone and smaller
to just rely on native APIs (which are sufficient for a client) rather than
try to dynamically pull stuff in.
