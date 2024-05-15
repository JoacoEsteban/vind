import { pageOverridesMessages } from '~messages/storage'
import type { PageOverrideDoc, PageOverrideInsertType } from '~background/storage/db'
import { log } from '../log'
import { Domain, Path, urlFromParts } from '../url'
import { filter } from 'rxjs'
import { PageOverride, PageOverrideInput } from '~lib/page-override'
import { throwOnResponseError } from '.'

export interface PageOverridesChannel {
  getAllPageOverrides: () => Promise<PageOverride[]>
  getPageOverridesForSite: (domain: Domain, path: Path) => Promise<PageOverride[]>
  addPageOverride: (pageOverride: PageOverrideInput) => Promise<void>
  togglePageOverride: (pageOverride: PageOverrideInput) => Promise<void>
  updatePageOverride: (pageOverride: PageOverride) => Promise<void>
  upsertPageOverride: (pageOverride: PageOverride) => Promise<void>
  removePageOverride: (id: number) => Promise<void>
}

export function toPageOverridesDoc (PageOverride: PageOverride): PageOverrideDoc {
  return {
    id: PageOverride.id,
    overrides_domain_path: PageOverride.overridesDomain.withPath(PageOverride.overridesPath).href,
    bindings_path: PageOverride.bindingsPath.value,
  }
}

export function fromPageOverridesDoc (doc: PageOverrideDoc): PageOverride {
  const url = urlFromParts(doc.overrides_domain_path, '').href
  return new PageOverride(
    doc.id,
    new Domain(url),
    new Path(url),
    new Path(doc.bindings_path)
  )
}

export function fromManyPageOverridesDoc (docs: PageOverrideDoc[]): PageOverride[] {
  return docs.map(fromPageOverridesDoc)
}

export class PageOverridesChannelImpl implements PageOverridesChannel {
  public onPageOverrideRemoved$ = pageOverridesMessages.onPageOverrideRemoved.stream
  public onPageOverrideAdded$ = pageOverridesMessages.onPageOverrideAdded.stream
  public onPageOverrideUpdated$ = pageOverridesMessages.onPageOverrideUpdated.stream

  async getAllPageOverrides () {
    return pageOverridesMessages.getAllPageOverrides.ask().then(fromManyPageOverridesDoc)
  }

  async getPageOverridesForSite (domain: Domain, path: Path) {
    return pageOverridesMessages.getPageOverridesForSite.ask({
      domain: domain.value,
      path: path.value
    }).then(fromManyPageOverridesDoc)
  }
  async addPageOverride (input: PageOverrideInput) {
    return pageOverridesMessages.addPageOverride.ask(input.getInput()).then(throwOnResponseError)
  }
  async togglePageOverride (input: PageOverrideInput) {
    return pageOverridesMessages.togglePageOverride.ask(input.getInput()).then(throwOnResponseError)
  }
  async updatePageOverride (override: PageOverride) {
    const doc = toPageOverridesDoc(override)
    return pageOverridesMessages.updatePageOverride.ask(doc).then(throwOnResponseError)
  }
  async upsertPageOverride (override: PageOverride) {
    const doc = toPageOverridesDoc(override)
    return pageOverridesMessages.upsertPageOverride.ask(doc).then(throwOnResponseError)
  }
  async removePageOverride (id: number) {
    return pageOverridesMessages.removePageOverride.ask(id).then(throwOnResponseError)
  }
}