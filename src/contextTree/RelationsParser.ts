import { ContextTreeStore } from './ContextTreeStore.js';

/**
 * Utilities for parsing and validating relations in context.md files
 * Relations enable graph-like navigation between context files
 */
export class RelationsParser {
  /**
   * Extract relations from a markdown content string
   * Relations are in the format @domain/topic or @domain/topic/subtopic
   * They appear in a ## Relations section
   * 
   * @param markdownContent The markdown content to parse
   * @returns Array of relation strings (e.g., ["@code_style/error-handling", "@testing/integration-tests/api-tests"])
   */
  static extractRelations(markdownContent: string): string[] {
    const relations: string[] = [];
    
    // Find the Relations section
    const relationsMatch = markdownContent.match(/^## Relations\s*$(.*?)(?=^##|\z)/ims);
    if (!relationsMatch) {
      return relations;
    }

    const relationsSection = relationsMatch[1];
    
    // Extract all @domain/topic or @domain/topic/subtopic patterns
    const relationPattern = /@([a-z_]+)\/([a-z_-]+)(?:\/([a-z_-]+))?/gi;
    let match;
    
    while ((match = relationPattern.exec(relationsSection)) !== null) {
      relations.push(match[0]);
    }

    return relations;
  }

  /**
   * Resolve a relation string into its components
   * 
   * @param relation The relation string (e.g., "@code_style/error-handling/api-tests")
   * @returns Object with domain, topic, and optional subtopic
   */
  static resolveRelationPath(relation: string): { domain: string; topic: string; subtopic?: string } | null {
    const pattern = /^@([a-z_]+)\/([a-z_-]+)(?:\/([a-z_-]+))?$/i;
    const match = relation.match(pattern);
    
    if (!match) {
      return null;
    }

    return {
      domain: match[1],
      topic: match[2],
      subtopic: match[3] || undefined,
    };
  }

  /**
   * Validate that a relation points to an existing context.md file
   * 
   * @param relation The relation string to validate
   * @param store The ContextTreeStore instance
   * @returns True if the relation points to an existing file
   */
  static async validateRelation(relation: string, store: ContextTreeStore): Promise<boolean> {
    const parsed = this.resolveRelationPath(relation);
    if (!parsed) {
      return false;
    }

    try {
      // Check if context.md exists at the target location
      await store.readMemory(parsed.domain, parsed.topic, 'context.md', parsed.subtopic);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all valid relations from a context.md file
   * This validates each relation and returns only those that exist
   * 
   * @param markdownContent The markdown content to parse
   * @param store The ContextTreeStore instance
   * @returns Array of valid relation objects
   */
  static async getValidRelations(
    markdownContent: string,
    store: ContextTreeStore
  ): Promise<Array<{ relation: string; domain: string; topic: string; subtopic?: string }>> {
    const relations = this.extractRelations(markdownContent);
    const validRelations: Array<{ relation: string; domain: string; topic: string; subtopic?: string }> = [];

    for (const relation of relations) {
      const parsed = this.resolveRelationPath(relation);
      if (parsed && (await this.validateRelation(relation, store))) {
        validRelations.push({
          relation,
          ...parsed,
        });
      }
    }

    return validRelations;
  }

  /**
   * Format relations for inclusion in a markdown file
   * 
   * @param relations Array of relation strings
   * @returns Formatted markdown string for the Relations section
   */
  static formatRelationsSection(relations: string[]): string {
    if (relations.length === 0) {
      return '';
    }

    return '\n## Relations\n' + relations.map((r) => r).join('\n') + '\n';
  }

  /**
   * Add relations to markdown content
   * If a Relations section already exists, it merges the new relations
   * 
   * @param markdownContent The original markdown content
   * @param newRelations Array of relations to add
   * @returns Updated markdown content with relations
   */
  static addRelations(markdownContent: string, newRelations: string[]): string {
    const existingRelations = this.extractRelations(markdownContent);
    const allRelations = [...new Set([...existingRelations, ...newRelations])];

    // Remove existing Relations section if present
    const contentWithoutRelations = markdownContent.replace(/^## Relations\s*$(.*?)(?=^##|\z)/ims, '').trim();

    // Add the Relations section at the end
    return contentWithoutRelations + this.formatRelationsSection(allRelations);
  }
}

