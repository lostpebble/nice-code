import type { INiceErrorOptions } from "../../NiceError/NiceError";
import type { INiceErrorDomainProps } from "../../NiceError/NiceError.types";

export const nice_error_test_options: INiceErrorOptions<
  INiceErrorDomainProps,
  keyof INiceErrorDomainProps["schema"]
> = {
  def: {
    domain: "TEST_DOMAIN",
    allDomains: ["TEST_DOMAIN"],
  },
  message: "Test error",
  errorData: {},
  ids: [],
  wasntNice: false,
};
