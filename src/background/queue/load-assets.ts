import type { ClipAssets } from '../../shared/clip-assets'

// How a commit asks for its clip's images. The queue supplies it, so the step
// runs after the commit has refused a denylisted host or missing settings -
// nothing is fetched for a clip that cannot be committed.
export type LoadAssets = () => Promise<ClipAssets>
