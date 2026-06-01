import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { concatenateResources } from "../util/resources"

interface FloatingControlsOptions {
  components: QuartzComponent[]
}

export default ((opts?: Partial<FloatingControlsOptions>) => {
  const FloatingControlsComponent: QuartzComponent = (props: QuartzComponentProps) => {
    const components = opts?.components ?? []
    return (
      <div class="floating-controls">
        {components.map((Component) => (
          <Component {...props} />
        ))}
      </div>
    )
  }

  const childComponents = opts?.components ?? []

  FloatingControlsComponent.css = concatenateResources(
    floatingControlsStyle,
    ...childComponents.map((c) => c.css),
  )

  FloatingControlsComponent.beforeDOMLoaded = concatenateResources(
    ...childComponents.map((c) => c.beforeDOMLoaded),
  )

  FloatingControlsComponent.afterDOMLoaded = concatenateResources(
    ...childComponents.map((c) => c.afterDOMLoaded),
  )

  return FloatingControlsComponent
}) satisfies QuartzComponentConstructor

const floatingControlsStyle = `
.floating-controls {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 999;
  display: flex;
  gap: 0.5rem;
  background-color: var(--light);
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid var(--lightgray);
}

@media (max-width: 800px) {
  .floating-controls {
    bottom: 0.75rem;
    left: 0.75rem;
    padding: 0.4rem;
    gap: 0.4rem;
  }
}

html[reader-mode="on"] .floating-controls {
  display: flex !important;
}

.floating-controls button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.floating-controls button:hover {
  background-color: var(--lightgray);
}

.floating-controls button svg {
  width: 1.2rem;
  height: 1.2rem;
}
`
