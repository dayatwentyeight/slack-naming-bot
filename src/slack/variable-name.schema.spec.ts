import { variableNameSchema } from './variable-name.schema';

describe('variableNameSchema', () => {
  it('should remove invalid characters and return a cleaned variable name', () => {
    const input = "company'sName";
    const expectedOutput = 'companysName';
    const result = variableNameSchema.parse(input);
    expect(result).toBe(expectedOutput);
  });

  it('should allow valid variable names', () => {
    const input = 'ProcessingStatus';
    const result = variableNameSchema.parse(input);
    expect(result).toBe(input);
  });

  it('should add an underscore if the variable name starts with a number after cleaning', () => {
    const input = '1_million_count';
    const expectedOutput = '_1_million_count';
    const result = variableNameSchema.parse(input);
    expect(result).toBe(expectedOutput);
  });
});
