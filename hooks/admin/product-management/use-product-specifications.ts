import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productSpecificationService, ProductSpecification, CreateSpecificationRequest, UpdateSpecificationRequest } from '@/services/admin/product-specification.service';
import { toast } from 'sonner';

/**
 * Hook to fetch product specifications
 */
export function useProductSpecifications(productId: string | number | null | undefined) {
	return useQuery({
		queryKey: ['product-specifications', productId],
		queryFn: () => productSpecificationService.getSpecifications(productId!),
		enabled: !!productId,
	});
}

/**
 * Hook to create a specification
 */
export function useCreateSpecification(productId: string | number | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateSpecificationRequest) => {
			if (!productId || isNaN(Number(productId))) {
				throw new Error(`Invalid Product ID: ${productId}. Please save the product properly first.`);
			}
			return productSpecificationService.createSpecification(productId, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['product-specifications', productId] });
			toast.success('Specification created');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create specification');
		},
	});
}

/**
 * Hook to update a single specification
 */
export function useUpdateSpecification(productId: string | number | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ specId, data }: { specId: string; data: UpdateSpecificationRequest }) => {
			if (!productId || isNaN(Number(productId))) {
				throw new Error(`Invalid Product ID: ${productId}. Please save the product properly first.`);
			}
			return productSpecificationService.updateSpecification(productId, specId, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['product-specifications', productId] });
			toast.success('Specification saved');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update specification');
		},
	});
}

/**
 * Hook to bulk update specifications
 */
export function useBulkUpdateSpecifications(productId: string | number | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (specifications: ProductSpecification[]) => {
			if (!productId || isNaN(Number(productId))) {
				throw new Error(`Invalid Product ID: ${productId}. Please save the product properly first.`);
			}
			return productSpecificationService.bulkUpdateSpecifications(productId, specifications);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['product-specifications', productId] });
			toast.success('All specifications saved');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to save specifications');
		},
	});
}

/**
 * Hook to delete a specification
 */
export function useDeleteSpecification(productId: string | number | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (specId: string) => {
			if (!productId || isNaN(Number(productId))) {
				throw new Error(`Invalid Product ID: ${productId}. Please save the product properly first.`);
			}
			return productSpecificationService.deleteSpecification(productId, specId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['product-specifications', productId] });
			toast.success('Specification deleted');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete specification');
		},
	});
}
