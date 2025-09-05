'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FieldValues, Path, PathValue, DefaultValues } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database.types' // Import your generated Supabase types

// Use exact Json type from Supabase
type Json = Database['public']['Tables']['users']['Row']['settings']

// Type definitions with exact types
interface LabelConfig {
  label: string
  description?: string
  placeholder?: string
  options?: Record<string, string>
}

interface ColumnInfo {
  data_type: string
  is_nullable: boolean
  column_default?: string | null
  character_maximum_length?: number | null
}

// Exact type for default values - no 'any'
type DefaultValue = string | number | boolean | null | undefined | string[] | Json

interface DynamicFormProps<TFieldValues extends FieldValues = FieldValues> {
  schema: z.ZodObject<z.ZodRawShape>
  onSubmitAction: (data: TFieldValues) => void | Promise<void>
  isLoading?: boolean
  initialValues?: Partial<TFieldValues>
  labels?: Record<string, string | LabelConfig>
  columnInfo?: Record<string, ColumnInfo>
  className?: string
  submitButtonText?: string
  cancelButtonText?: string
  onCancelAction?: () => void
  showReset?: boolean
  fieldOrder?: string[]
  renderBeforeSubmit?: () => React.ReactNode
  renderAfterSubmit?: () => React.ReactNode
}

// Type guard for ZodOptional
function isZodOptional(schema: z.ZodTypeAny): schema is z.ZodOptional<z.ZodTypeAny> {
  return schema._def?.typeName === z.ZodFirstPartyTypeKind.ZodOptional
}

// Type guard for ZodNullable
function isZodNullable(schema: z.ZodTypeAny): schema is z.ZodNullable<z.ZodTypeAny> {
  return schema._def?.typeName === z.ZodFirstPartyTypeKind.ZodNullable
}

// Type guard for ZodDefault
function isZodDefault(schema: z.ZodTypeAny): schema is z.ZodDefault<z.ZodTypeAny> {
  return schema._def?.typeName === z.ZodFirstPartyTypeKind.ZodDefault
}

// Type guard for ZodEffects
function isZodEffects(schema: z.ZodTypeAny): schema is z.ZodEffects<z.ZodTypeAny> {
  return schema._def?.typeName === z.ZodFirstPartyTypeKind.ZodEffects
}

// Type guard for ZodEnum
function isZodEnum(schema: z.ZodTypeAny): schema is z.ZodEnum<[string, ...string[]]> {
  return schema._def?.typeName === z.ZodFirstPartyTypeKind.ZodEnum
}


// Helper to get the actual type name from Zod schema
const getZodTypeName = (schema: z.ZodTypeAny): z.ZodFirstPartyTypeKind | 'unknown' => {
  const def = schema._def
  if (!def || !def.typeName) return 'unknown'
  return def.typeName
}

// Helper to unwrap optional/nullable/default types with proper type guards
const unwrapZodType = (fieldSchema: z.ZodTypeAny): z.ZodTypeAny => {
  let currentSchema = fieldSchema

  // Keep unwrapping until we get to the base type
  while (true) {
    if (isZodOptional(currentSchema)) {
      currentSchema = currentSchema.unwrap()
    } else if (isZodNullable(currentSchema)) {
      currentSchema = currentSchema.unwrap()
    } else if (isZodDefault(currentSchema)) {
      currentSchema = currentSchema.removeDefault()
    } else if (isZodEffects(currentSchema)) {
      // For ZodEffects, get the inner schema
      const innerSchema = currentSchema._def.schema
      if (innerSchema) {
        currentSchema = innerSchema
      } else {
        break
      }
    } else {
      break
    }
  }

  return currentSchema
}

// Helper to get default value based on type
const getDefaultValue = (fieldSchema: z.ZodTypeAny): DefaultValue => {
  // Check for explicit default in ZodDefault
  if (isZodDefault(fieldSchema)) {
    const defaultValueFn = fieldSchema._def.defaultValue
    if (typeof defaultValueFn === 'function') {
      return defaultValueFn()
    }
  }

  const baseType = unwrapZodType(fieldSchema)
  const typeName = getZodTypeName(baseType)

  switch (typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return ''
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return false
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return 0
    case z.ZodFirstPartyTypeKind.ZodEnum:
      if (isZodEnum(baseType)) {
        const values = baseType._def.values
        return values[0] || ''
      }
      return ''
    case z.ZodFirstPartyTypeKind.ZodArray:
      return []
    case z.ZodFirstPartyTypeKind.ZodObject:
      return {}
    default:
      return undefined
  }
}

function DynamicFormInner<TFieldValues extends FieldValues = FieldValues>({
  schema,
  onSubmitAction,
  isLoading = false,
  initialValues,
  labels,
  columnInfo,
  className,
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  onCancelAction,
  showReset = false,
  fieldOrder,
  renderBeforeSubmit,
  renderAfterSubmit,
}: DynamicFormProps<TFieldValues>) {
  const isInitializingRef = useRef(true)

  // Build default values from schema
  const defaultValues = React.useMemo(() => {
    const values: Record<string, DefaultValue> = {}
    const schemaShape = schema.shape
    
    if (schemaShape) {
      Object.keys(schemaShape).forEach((key) => {
        const fieldSchema = schemaShape[key] as z.ZodTypeAny
        if (fieldSchema) {
          values[key] = getDefaultValue(fieldSchema)
        }
      })
    }
    
    return values as DefaultValues<TFieldValues>
  }, [schema])

  // Initialize form with proper typing
  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  // Handle initial values
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      isInitializingRef.current = true
      
      const processedValues: Record<string, DefaultValue> = {}
      const schemaShape = schema.shape
      
      if (schemaShape) {
        Object.keys(schemaShape).forEach((key) => {
          const fieldSchema = schemaShape[key] as z.ZodTypeAny
          if (!fieldSchema) return
          
          const value = initialValues[key as keyof typeof initialValues]
          const baseType = unwrapZodType(fieldSchema)
          const typeName = getZodTypeName(baseType)
          
          // Process value based on type
          switch (typeName) {
            case z.ZodFirstPartyTypeKind.ZodBoolean:
              processedValues[key] = Boolean(value)
              break
            case z.ZodFirstPartyTypeKind.ZodNumber:
              processedValues[key] = value == null ? 0 : Number(value)
              break
            case z.ZodFirstPartyTypeKind.ZodString:
              processedValues[key] = value == null ? '' : String(value)
              break
            case z.ZodFirstPartyTypeKind.ZodArray:
              if (Array.isArray(value)) {
                processedValues[key] = value
              } else if (typeof value === 'string' && value.startsWith('{')) {
                // Handle PostgreSQL array format
                try {
                  const innerContent = value.slice(1, -1)
                  processedValues[key] = innerContent ? innerContent.split(',').map((item: string) => item.trim()) : []
                } catch {
                  processedValues[key] = []
                }
              } else {
                processedValues[key] = []
              }
              break
            default:
              processedValues[key] = value as DefaultValue
          }
        })
      }
      
      form.reset(processedValues as DefaultValues<TFieldValues>)
      
      setTimeout(() => {
        isInitializingRef.current = false
      }, 0)
    } else {
      isInitializingRef.current = false
    }
  }, [initialValues, form, schema])

  // Render individual field with proper typing
  const renderField = (fieldName: string): React.ReactElement => {
    const schemaShape = schema.shape
    if (!schemaShape || !schemaShape[fieldName]) return <React.Fragment key={fieldName} />
    
    const fieldSchema = schemaShape[fieldName] as z.ZodTypeAny
    const baseType = unwrapZodType(fieldSchema)
    const typeName = getZodTypeName(baseType)
    const description = fieldSchema.description
    
    const labelConfig = labels?.[fieldName]
    const label = typeof labelConfig === 'string' 
      ? labelConfig 
      : labelConfig?.label || fieldName
    const placeholder = typeof labelConfig === 'object' 
      ? labelConfig.placeholder 
      : `Enter ${fieldName}`
    const fieldDescription = typeof labelConfig === 'object' 
      ? labelConfig.description 
      : description
    
    const colInfo = columnInfo?.[fieldName]
    const isNullable = colInfo?.is_nullable || false
    const maxLength = colInfo?.character_maximum_length

    return (
      <FormField<TFieldValues>
        key={fieldName}
        control={form.control}
        name={fieldName as Path<TFieldValues>}
        render={({ field }) => {
          // Render different input types based on the Zod schema type
          switch (typeName) {
            case z.ZodFirstPartyTypeKind.ZodString: {
              const isLongText = maxLength && maxLength > 255
              const InputComponent = isLongText ? Textarea : Input
              
              return (
                <FormItem className="space-y-2">
                  <FormLabel>{label}</FormLabel>
                  {fieldDescription && (
                    <FormDescription>{fieldDescription}</FormDescription>
                  )}
                  <FormControl>
                    <InputComponent
                      placeholder={placeholder}
                      {...field}
                      value={String(field.value || '')}
                      maxLength={maxLength || undefined}
                      className={cn(
                        isLongText && 'min-h-[100px]'
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }
            
            case z.ZodFirstPartyTypeKind.ZodNumber:
              return (
                <FormItem className="space-y-2">
                  <FormLabel>{label}</FormLabel>
                  {fieldDescription && (
                    <FormDescription>{fieldDescription}</FormDescription>
                  )}
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={placeholder}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const num = parseFloat(value)
                        field.onChange(isNaN(num) ? undefined : num)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            
            case z.ZodFirstPartyTypeKind.ZodBoolean:
              return (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{label}</FormLabel>
                    {fieldDescription && (
                      <FormDescription>{fieldDescription}</FormDescription>
                    )}
                  </div>
                  <FormControl>
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )
            
            case z.ZodFirstPartyTypeKind.ZodEnum: {
              if (!isZodEnum(baseType)) return <></>
              const options: readonly string[] = baseType._def.values
              const optionLabels = typeof labelConfig === 'object' ? labelConfig.options : undefined
              
              return (
                <FormItem className="space-y-2">
                  <FormLabel>{label}</FormLabel>
                  {fieldDescription && (
                    <FormDescription>{fieldDescription}</FormDescription>
                  )}
                  <Select
                    onValueChange={field.onChange}
                    value={String(field.value || '')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={placeholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isNullable && (
                        <SelectItem value="">None</SelectItem>
                      )}
                      {options.map((option: string) => (
                        <SelectItem key={option} value={option}>
                          {optionLabels?.[option] || option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }
            
            case z.ZodFirstPartyTypeKind.ZodArray:
              return (
                <FormItem className="space-y-2">
                  <FormLabel>{label}</FormLabel>
                  {fieldDescription && (
                    <FormDescription>{fieldDescription}</FormDescription>
                  )}
                  <FormControl>
                    <Textarea
                      placeholder='Enter as JSON array: ["item1", "item2"]'
                      {...field}
                      value={
                        field.value == null
                          ? ''
                          : Array.isArray(field.value)
                            ? JSON.stringify(field.value)
                            : String(field.value || '')
                      }
                      onChange={(e) => {
                        const value = e.target.value
                        if (value.trim() === '') {
                          field.onChange((isNullable ? null : []) as PathValue<TFieldValues, Path<TFieldValues>>)
                        } else {
                          try {
                            const parsed = JSON.parse(value)
                            field.onChange((Array.isArray(parsed) ? parsed : value) as PathValue<TFieldValues, Path<TFieldValues>>)
                          } catch {
                            field.onChange(value as PathValue<TFieldValues, Path<TFieldValues>>)
                          }
                        }
                      }}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            
            default:
              // Return empty fragment for unsupported types
              return <></>
          }
        }}
      />
    )
  }

  // Determine field order
  const fieldsToRender = fieldOrder || (schema.shape ? Object.keys(schema.shape) : [])

  const handleSubmit = form.handleSubmit((data) => {
    onSubmitAction(data)
  })

  const handleCancel = () => {
    if (onCancelAction) {
      onCancelAction()
    }
  }

  const handleReset = () => {
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
        {fieldsToRender.map((fieldName) => renderField(fieldName))}
        
        {renderBeforeSubmit?.()}
        
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Loading...' : submitButtonText}
          </Button>
          
          {onCancelAction && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelButtonText}
            </Button>
          )}
          
          {showReset && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </Button>
          )}
        </div>
        
        {renderAfterSubmit?.()}
      </form>
    </Form>
  )
}

// Export the component with proper typing
export const DynamicForm = React.memo(DynamicFormInner) as typeof DynamicFormInner